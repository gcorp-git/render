;(function(){
	'use strict';

	const STATE = {
		instances: new WeakMap(),
	};

	class Render {
		static attach( args ) {
			const instance = new RenderInstance( args );

			STATE.instances.set( instance.app, instance );

			return instance.app;
		}
		static detach( app ) {
			const instance = STATE.instances.get( app );

			if ( !instance ) return;

			instance.destructor();

			STATE.instances.delete( instance.app );
		}
	};

	window.Render = Render;

})();