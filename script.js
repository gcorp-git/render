;(function(){
	'use strict';

	window.app = Render.attach({
		selector: '#app',
		props: {
			style: { color: 'red' },
			lorem: 'Lorem ipsum dolor sit amet, consectetur, adipisicing elit.',
		},
		hooks: {
			change: changes => {
				console.log( 'changes', changes );
			},
		},
		methods: {
			test( e, n ) {
				console.log( 'test', n, e );
			},
			md( m ) {
				console.log( 'mousedown', m );
			},
		},
	});

	// Render.detach( app );

})();