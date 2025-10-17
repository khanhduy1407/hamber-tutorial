import App from './App.hamber';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;