;(function(){
	'use strict';

	class RenderSpy {
		constructor( app ) {
			for ( const $child of app.$node.childNodes ) {
				_spy( app, $child );
			}

			app.observer = _createObserver( app );
			app.observer.observe( app.$node, { childList: true, subtree: true } );
		}
		destructor() {
			app.observer.disconnect();
			
			for ( const $child of app.$node.childNodes ) {
				_unspy( app, $child );
			}
		}
	};

	window.RenderSpy = RenderSpy;

	function _createObserver( app ) {
		return new MutationObserver(( mutations, observer ) => {
			let needsRender = false;

			for ( const mutation of mutations ) {
				switch ( mutation.type ) {
					case 'childList': {
						if ( mutation.addedNodes.length ) {
							for ( const $node of mutation.addedNodes ) {
								_spy( app, $node );
							}
						}
						if ( mutation.removedNodes.length ) {
							for ( const $node of mutation.removedNodes ) {
								_unspy( app, $node );
							}
						}

						needsRender = true;
					} break;
				}
			}

			if ( needsRender ) app.isChanged = true;
		});
	}

	function _spy( app, $node ) {
		if ( $node !== app.$node && _getParentAppNode( $node ) !== app.$node ) return;

		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = app.map.get( $node.parentElement );
				const o = new RenderHTMLElement( $node, app );

				if ( parent ) parent.children.add( o );
				
				app.map.set( $node, o );

				for ( const $child of $node.childNodes ) {
					_spy( app, $child );
				}
			} break;
			case $node instanceof Text: {
				const parent = app.map.get( $node.parentElement );
				const o = new RenderText( $node, app );

				if ( parent ) parent.children.add( o );

				app.map.set( $node, o );
			} break;
		}
	}

	function _unspy( app, $node ) {
		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = app.map.get( $node.parentElement );
				const o = app.map.get( $node );

				if ( !o ) return;

				for ( const child of o.children ) {
					_unspy( app, child.$node );
				}

				o.destructor();

				if ( parent ) parent.children.delete( o );
				
				app.map.delete( $node, o );
			} break;
			case $node instanceof Text: {
				const parent = app.map.get( $node.parentElement );
				const o = app.map.get( $node );

				if ( !o ) return;

				o.destructor();

				if ( parent ) parent.children.delete( o );

				app.map.delete( $node, o );
			} break;
		}
	}

	function _getParentAppNode( $node ) {
		let $parent = $node.parentElement;
		
		while ( $parent ) {
			if ( $parent.tagName.indexOf( 'APP-' ) === 0 ) return $parent;

			$parent = $parent.parentElement;
		}

		return null;
	}

})();