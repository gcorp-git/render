;(function(){
	'use strict';

	window.app = Render.attach({
		selector: '#app',
		props: {
			style: { color: 'red' },
			lorem: 'Lorem ipsum dolor sit amet, consectetur, adipisicing elit.',
		},
		hooks: {
			created: $node => {
				console.log( 'created' );

				const html = `
					<p>111</p>
					<p :style="this.style" @click="this.test($event, 'inserted-p-argument')">222</p>
					<p>333</p>
				`;

				const inserted = Render.insert( html, 'afterbegin', $node );

				console.log( 'inserted', inserted );
			},
			changed: ( name, value ) => {
				console.log( 'changed', name, value );
			},
			destroyed: () => {
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
				Render.detach( window.app );
			},
		},
	});

})();