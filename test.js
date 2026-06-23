import https from 'https';
https.get('https://frqxngwyrzjbdqkoaior.supabase.co/auth/v1/token?grant_type=password', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
