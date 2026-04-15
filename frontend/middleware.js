export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  const authorizationHeader = request.headers.get('authorization');

  if (authorizationHeader) {
    const basicAuth = authorizationHeader.split(' ')[1];
    
    try {
      const decodedUserPass = atob(basicAuth);
      // We use index of colon to support passwords that might contain a colon
      const index = decodedUserPass.indexOf(':');
      if (index !== -1) {
        const user = decodedUserPass.substring(0, index);
        const password = decodedUserPass.substring(index + 1);

        const expectedUser = process.env.BASIC_AUTH_USER || 'alessioerbeia@gmail.com';
        const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

        if (
          user === expectedUser &&
          password === expectedPassword
        ) {
          // Continue with the request if credentials match
          return;
        }
      }
    } catch (e) {
      // Decode error, fallback to prompt
    }
  }

  // Prompt for basic auth if missing or invalid
  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Trader Vision Secure Area"'
    }
  });
}
