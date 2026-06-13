import http from 'https';

http.get('https://ilshthmfnllsrynjdxeh.supabase.co', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('\nHeaders:');
  console.log(JSON.stringify(res.headers, null, 2));
}).on('error', (err) => {
  console.error('Error:', err.message);
});
