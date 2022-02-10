;(function(){
	'use strict';

	const STATE = {
		instances: new WeakMap(),
		$fragment: null,
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
		static insert( $node, position, $parent ) {
			$node = $node instanceof Node ? $node : _createHTMLElement( $node );
			$parent = $parent instanceof Node ? $parent : document.querySelector( $parent );

			if ( $node instanceof Array && $node.length === 1 ) {
				$node = $node[0];
			}

			if ( $node instanceof Array ) {
				const result = [];

				switch ( position ) {
					case 'beforebegin':
					case 'beforeend': {
						for ( let i = 0, end = $node.length - 1; i <= end; i++ ) {
							result.push( $parent.insertAdjacentElement( position, $node[ i ] ) );
						}
					} break;
					case 'afterbegin':
					case 'afterend': {
						for ( let i = $node.length - 1, end = 0; i >= end; i-- ) {
							result.push( $parent.insertAdjacentElement( position, $node[ i ] ) );
						}
					} break;
					default: {
						throw 'incorrect position argument';
					} break;
				}

				return result;
			}

			return $parent.insertAdjacentElement( position, $node );
		}
	};

	window.Render = Render;

	function _createHTMLElement( html ) {
		_prepareFragment();

		STATE.$fragment.innerHTML = html;

		const result = [];

		for ( const $node of STATE.$fragment.childNodes ) {
			if ( $node instanceof HTMLElement ) {
				result.push( $node );
			}
		}

		return result;
	}

	function _prepareFragment() {
		if ( STATE.$fragment ) return;

		const fragment = document.createDocumentFragment();

		fragment.appendChild( document.createElement( 'body' ) );

		STATE.$fragment = fragment.querySelector( 'body' );
	}

})();