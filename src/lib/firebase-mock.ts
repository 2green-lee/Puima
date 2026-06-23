import { supabase } from './supabase';

export const db = {};
export const auth = {
    get currentUser() {
        // Warning: this is synchronous and might be null if session not loaded. 
        // We'll rely on localstorage or just a global state if needed, but for Admin.tsx/App.tsx it might suffice
        return null; // Will fix later if auth.currentUser is heavily used
    },
    signOut: () => supabase.auth.signOut(),
};
export const storage = {};

export function handleFirestoreError(err: any) {
    console.error(err);
}
export enum OperationType {
    CREATE, UPDATE, DELETE, GET, LIST
}
export const loginWithGoogle = async () => supabase.auth.signInWithOAuth({ provider: 'google' });
export const logout = async () => supabase.auth.signOut();

export const serverTimestamp = () => new Date().toISOString();

export function collection(db: any, ...paths: string[]) {
    // collection(db, "users") -> path "users"
    // collection(docRef, "chapters") -> docRef.path + "/chapters"
    if (db._type === 'doc') {
        return { _type: 'collection', path: [...paths].join('/') }; // Assuming chapters is root table!
    }
    return { _type: 'collection', path: paths.join('/') };
}
export function collectionGroup(db: any, name: string) {
    return { _type: 'collection', path: name };
}
export function doc(dbOrColl: any, ...paths: string[]) {
    if (dbOrColl._type === 'collection') {
        return { _type: 'doc', path: dbOrColl.path, id: paths[paths.length - 1] };
    }
    // doc(db, "posts", id)
    return { _type: 'doc', path: paths[0], id: paths[paths.length - 1] };
}

export function query(coll: any, ...constraints: any[]) {
    return { _type: 'query', path: coll.path, constraints };
}
export function orderBy(field: string, dir: string) {
    return { _type: 'orderBy', field, dir };
}
export function where(field: string, op: string, val: any) {
    return { _type: 'where', field, op, val };
}

function applyConstraints(q: any, constraints: any[]) {
    for (const c of constraints) {
        if (c._type === 'orderBy') q = q.order(c.field, { ascending: c.dir === 'asc' });
        if (c._type === 'where' && c.op === '==') q = q.eq(c.field, c.val);
    }
    return q;
}

const localUpdateBus = new EventTarget();

function deserializeData(path: string, d: any) {
    let res = {...d};
    if (path === 'notices' || path.startsWith('notices/') || path.endsWith('/notices')) {
        if (res.url && res.url.startsWith('{')) {
            try {
                const extra = JSON.parse(res.url);
                Object.assign(res, extra);
            } catch(e) {}
        }
    }
    if (res.vimeoId && res.vimeoId.startsWith('{')) {
        try {
            const extra = JSON.parse(res.vimeoId);
            Object.assign(res, extra);
        } catch(e) {}
    }
    return res;
}

export function onSnapshot(qRef: any, callback: any, errorCb?: any) {
    const fetch = () => {
        let q = supabase.from(qRef.path).select('*');
        q = applyConstraints(q, qRef.constraints || []);
        q.then(({ data, error }) => {
            if (error) { if (errorCb) errorCb(error); return; }
            callback({ docs: (data||[]).map((d: any) => ({ id: d.id, data: () => deserializeData(qRef.path, d) })) });
        });
    };
    fetch();
    
    const listener = () => fetch();
    localUpdateBus.addEventListener(qRef.path, listener);
    
    const ch = supabase.channel(qRef.path + Date.now()).on('postgres_changes', { event: '*', schema: 'public', table: qRef.path }, fetch).subscribe();
    return () => {
        localUpdateBus.removeEventListener(qRef.path, listener);
        supabase.removeChannel(ch); // unsubscribe
    };
}

function sanitizeData(path: string, data: any) {
    const d = { ...data };
    delete d.updatedAt;
    
    if (path === 'chapters' || path.endsWith('/chapters')) {
        const extra: any = {};
        if (d.chapterNo !== undefined) extra.chapterNo = d.chapterNo;
        if (d.milestones !== undefined) extra.milestones = d.milestones;
        if (d.recipe !== undefined) extra.recipe = d.recipe;
        if (Object.keys(extra).length > 0) {
            d.vimeoId = JSON.stringify(extra);
            delete d.chapterNo;
            delete d.milestones;
            delete d.recipe;
        }
    }
    if (path === 'notices' || path.startsWith('notices/') || path.endsWith('/notices')) {
        const extra: any = {};
        if (d.bannerLabel !== undefined) extra.bannerLabel = d.bannerLabel;
        if (d.bannerLabelEn !== undefined) extra.bannerLabelEn = d.bannerLabelEn;
        if (d.url !== undefined) extra.url = d.url;
        if (Object.keys(extra).length > 0) {
            d.url = JSON.stringify(extra);
            delete d.bannerLabel;
            delete d.bannerLabelEn;
        }
    }
    return d;
}

export async function addDoc(coll: any, data: any) {
    const cleanData = sanitizeData(coll.path, data);
    const { data: res, error } = await supabase.from(coll.path).insert(cleanData).select().single();
    if (error) {
        if (coll.path.includes('settings')) return { id: 'mock' };
        throw error;
    }
    localUpdateBus.dispatchEvent(new Event(coll.path));
    return { id: res.id };
}

export async function setDoc(docRef: any, data: any, options?: any) {
    const cleanData = sanitizeData(docRef.path, data);
    const { error } = await supabase.from(docRef.path).upsert({ id: docRef.id, ...cleanData });
    if (error) {
        if (docRef.path.includes('settings')) return;
        throw error;
    }
    localUpdateBus.dispatchEvent(new Event(docRef.path));
}

export async function updateDoc(docRef: any, data: any) {
    const cleanData = sanitizeData(docRef.path, data);
    const { error } = await supabase.from(docRef.path).update(cleanData).eq('id', docRef.id);
    if (error) {
        if (docRef.path.includes('settings')) return;
        throw error;
    }
    localUpdateBus.dispatchEvent(new Event(docRef.path));
}

export async function deleteDoc(docRef: any) {
    const { error } = await supabase.from(docRef.path).delete().eq('id', docRef.id);
    if (error) throw error;
    localUpdateBus.dispatchEvent(new Event(docRef.path));
}

export async function getDoc(docRef: any) {
    const { data, error } = await supabase.from(docRef.path).select('*').eq('id', docRef.id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return {
        exists: () => !!data,
        data: () => data ? deserializeData(docRef.path, data) : null
    };
}

export async function getDocs(qRef: any) {
    let q = supabase.from(qRef.path).select('*');
    q = applyConstraints(q, qRef.constraints || []);
    const { data, error } = await q;
    if (error) throw error;
    return { docs: (data||[]).map((d: any) => ({ id: d.id, data: () => deserializeData(qRef.path, d) })) };
}

export function ref(storage: any, path: string) {
    return { path };
}

export function uploadBytesResumable(sRef: any, file: any) {
    const api = {
        snapshot: { ref: { path: sRef.path } },
        on: (event: string, start: any, errCb: any, completeCb: any) => {
            // Immediate mock progress
            if (start) start({ bytesTransferred: file.size / 2, totalBytes: file.size });
            // actual upload
            supabase.storage.from('images').upload(sRef.path, file, { upsert: true }).then(({ data, error }) => {
                if (error) {
                    if (errCb) errCb(error);
                } else {
                    api.snapshot.ref.path = data?.path || sRef.path;
                    if (completeCb) completeCb();
                }
            });
        }
    };
    return api;
}

export async function getDownloadURL(sRef: any) {
    const { data } = supabase.storage.from('images').getPublicUrl(sRef.path);
    return data.publicUrl;
}

export async function updateProfile(userParam: any, updates: { displayName?: string }) {
    if (updates.displayName) {
        await supabase.auth.updateUser({ data: { full_name: updates.displayName } });
    }
}

export async function updateEmail(userParam: any, email: string) {
    await supabase.auth.updateUser({ email });
}

export async function updatePassword(userParam: any, password: string) {
    await supabase.auth.updateUser({ password });
}

export async function sendPasswordResetEmail(authParam: any, email: string) {
    await supabase.auth.resetPasswordForEmail(email);
}

export async function signInWithEmailAndPassword(authParam: any, email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (!data.session) throw new Error("Invalid login credentials");
    return data;
}

export async function signOut(authParam: any) {
    await supabase.auth.signOut();
}
export function onAuthStateChanged(authInfo: any, callback: any) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
    });
    // Do initial call
    supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user || null);
    });
    return () => Object.values(data)[0]?.unsubscribe?.(); 
}

export type User = any;
