;(function(){
	'use strict';

	const STATE = {
		$fragment: null,
		apps: {},
		attached: new WeakMap(),
		declarationScheme: {
			props: v => typeof v === 'function',
			hooks: v => v instanceof Object,
			methods: v => v instanceof Object,
		},
	};

	class Render {
		static app( name, declaration ) {
			name = name.toLowerCase();

			if ( declaration === undefined ) return STATE.apps[ name ];

			if ( STATE.apps[ name ] ) {
				throw `render app '${name}' has been already registered`;
			}

			_checkDeclaration( name, declaration );

			STATE.apps[ name ] = declaration;

			window.customElements.define( `app-${name}`, _generateCustomElementClass() );
		}
	};

	window.Render = Render;

	function _generateCustomElementClass() {
		class RenderCustomElement extends HTMLElement {
			constructor() {
				const $node = super();
			}
			connectedCallback() {
				const pos = this.tagName.indexOf( '-' );
				const name = this.tagName.substr( pos + 1 ).toLowerCase();

				_attach( this, name.toLowerCase() );
			}
			disconnectedCallback() {
				_detach( this );
			}
			adoptedCallback() {
				_detach( this );
			}
		}

		return RenderCustomElement;
	}

	function _checkDeclaration( name, o ) {
		const die = () => { throw `render app '${name}': incorrect declaration`; };

		if ( !( o instanceof Object ) ) die();

		for ( const prop in o ) {
			const scheme = STATE.declarationScheme[ prop ];

			if ( typeof scheme !== 'function' ) die();
			if ( !scheme( o[ prop ] ) ) die();
		}
	}

	function _attach( $node, name ) {
		if ( !STATE.apps[ name ] ) {
			throw `render app '${name}' has not been registered yet`;
		}

		const instance = new RenderApp( name, $node, STATE.apps[ name ] );
	}

	function _detach( $node ) {
		const instance = STATE.attached.get( $node );

		if ( !instance ) return;

		instance.destructor();

		STATE.attached.delete( $node );
	}

})();