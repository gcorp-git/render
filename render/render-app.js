;(function(){
	'use strict';

	class RenderApp {
		constructor( name, $node, declaration ) {
			if ( !( $node instanceof HTMLElement ) ) {
				$node = document.querySelector( $node );

				if ( !( $node instanceof HTMLElement ) ) {
					throw 'incorrect selector';
				}
			}

			this.name = name;
			this.$node = $node;

			this.declaration = { ...declaration, props: declaration.props() };
			
			if ( !( this.declaration.props instanceof Object ) ) {
				throw `render app '${this.name}': incorrect declaration`;
			}

			this.app = _createAppProxy( this );

			this.dom = new RenderHTMLElement( this.$node, this );

			this.map = new WeakMap();
			this.map.set( this.$node, this.dom );

			this.isDestroyed = false;
			this.isChanged = true;

			this.spy = new RenderSpy( this );

			_detectChanges( this );

			if ( typeof this.declaration?.hooks?.created === 'function' ) {
				this.declaration.hooks.created.call( this.app, this.$node );
			}
		}
		destructor() {
			this.isDestroyed = true;

			if ( typeof this.declaration?.hooks?.destroyed === 'function' ) {
				this.declaration.hooks.destroyed.call( this.app );
			}

			this.spy.destructor();
		}
	};

	window.RenderApp = RenderApp;

	function _createAppProxy( app ) {
		let proxy = undefined;

		proxy = new Proxy( app.declaration, {
			get: ( target, name ) => {
				if ( name === '$event' ) return _dispatchEvent.bind( app );

				if ( typeof target.methods[ name ] === 'function' ) {
					return target.methods[ name ].bind( proxy );
				}

				if ( typeof target.hooks[ name ] === 'function' ) {
					return target.hooks[ name ].bind( proxy );
				}

				return target.props[ name ];
			},
			set: ( target, name, value ) => {
				if ( target.props[ name ] !== value ) {
					const previous = target.props[ name ];
					const current = value;

					target.props[ name ] = value;
					app.isChanged = true;

					if ( typeof target?.hooks?.changed === 'function' ) {
						target.hooks.changed.call( app.app, name, { previous, current } );
					}
				}

				return true;
			},
		});

		return proxy;
	}

	function _detectChanges( app ) {
		const step = delta => {
			if ( app.isDestroyed ) return;

			if ( app.isChanged ) {
				app.isChanged = false;
				app.dom.render();
			}

			window.requestAnimationFrame( step );
		};

		window.requestAnimationFrame( step );
	}

	function _dispatchEvent( name, detail ) {
		const options = { detail, bubbles: true };
		const event = new CustomEvent( name, options );
		
		this.$node.dispatchEvent( event );
	}

})();