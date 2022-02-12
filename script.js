;(function(){
	'use strict';

	const $app = document.querySelector( '#app' );

	Render.app( 'test', {
		props: () => ({
			style: { color: 'red' },
			lorem: 'Lorem ipsum dolor sit amet, consectetur, adipisicing elit.',
		}),
		hooks: {
			created( $node ) {
				console.log( 'created' );

				const html = `
					<p>111</p>
					<p :style="this.style" @click="this.test($event, 'inserted-p-argument')">222</p>
					<p>333</p>
				`;

				const inserted = Render.insert( html, 'afterbegin', $node );

				console.log( 'inserted', inserted );
			},
			changed( name, value ) {
				console.log( 'changed', name, value );
			},
			destroyed() {
				console.log( 'destroyed' );
			},
		},
		methods: {
			test( e, n ) {
				console.log( 'method:test', n, e );
			},
			md( m ) {
				console.log( 'method:md', m );
			},
			destroy() {
				$app.innerHTML = '';
			},
		},
	});

	$app.innerHTML = `
		<app-test>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
			<a
				href="/"
				@click.prevent="this.test($event, 'click-argument')"
				@mousedown="this.md('mousedown-argument')"
				:style="this.style"
			>
				<div>test</div>
			</a>
			<p>This text is mutable: \${this.lorem}</p>
			<p>Officiis corporis optio voluptatem itaque saepe.</p>
			<div :style="this.style" @click.prevent="this.destroy()">destroy</div>
		</app-test>
	`;

})();