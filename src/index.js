export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const segments = url.pathname.split('/').slice(1);
		const bucketName = segments.shift();
		const key = segments.join('/');

		if (request.method !== 'GET') {
			return new Response('Method Not Allowed', {
				status: 405,
				headers: { Allow: 'GET' },
			});
		}

		const bucket = env[bucketName];
		if (!bucket) {
			return new Response(`Bucket not found: ${bucketName}`, { status: 404 });
		}

		if (!key) {
			return new Response('No object key provided', { status: 400 });
		}

		const object = await bucket.get(key);
		if (!object) {
			return new Response(`Object Not Found: ${key}`, { status: 404 });
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);

		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/octet-stream');
		}

		headers.set('etag', object.httpEtag);
		headers.set('Cache-Control', 'public, max-age=86400');

		return new Response(object.body, { headers });
	},
};
