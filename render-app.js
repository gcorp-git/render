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

			this.app = _createAppProxy( this.declaration, this );

			this.dom = new RenderHTMLElement( this.$node, this );

			this.map = new WeakMap();
			this.map.set( this.$node, this.dom );

			this.isDestroyed = false;
			this.isChanged = true;

			for ( const $child of this.$node.childNodes ) {
				_spy( $child, this );
			}

			this.observer = _createObserver( this );

			this.observer.observe( this.$node, {
				childList: true,
				subtree: true,
			});

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

			this.observer.disconnect();

			for ( const $child of this.$node.childNodes ) {
				_unspy( $child, this );
			}
		}
	};

	window.RenderApp = RenderApp;

	function _createAppProxy( declaration, instance ) {
		let proxy = undefined;

		proxy = new Proxy( declaration, {
			get: ( target, name ) => {
				if ( name === '$event' ) return _dispatch.bind( instance );

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
					instance.isChanged = true;

					if ( typeof target?.hooks?.changed === 'function' ) {
						target.hooks.changed.call( instance.app, name, { previous, current } );
					}
				}

				return true;
			},
		});

		return proxy;
	}

	function _createObserver( instance ) {
		return new MutationObserver(( mutations, observer ) => {
			let needsRender = false;

			for ( const mutation of mutations ) {
				switch ( mutation.type ) {
					case 'childList': {
						if ( mutation.addedNodes.length ) {
							for ( const $node of mutation.addedNodes ) {
								_spy( $node, instance );
							}
						}
						if ( mutation.removedNodes.length ) {
							for ( const $node of mutation.removedNodes ) {
								_unspy( $node, instance );
							}
						}

						needsRender = true;
					} break;
				}
			}

			if ( needsRender ) instance.isChanged = true;
		});
	}

	function _getParentAppNode( $node, instance ) {
		let $parent = $node.parentElement;
		
		while ( $parent ) {
			if ( $parent.tagName.indexOf('APP-') === 0 ) return $parent;

			$parent = $parent.parentElement;
		}

		return null;
	}

	function _spy( $node, instance ) {
		if ( $node !== instance.$node ) {
			if ( _getParentAppNode( $node, instance ) !== instance.$node ) return;
		}

		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = instance.map.get( $node.parentElement );
				const o = new RenderHTMLElement( $node, instance );

				if ( parent ) parent.children.add( o );
				
				instance.map.set( $node, o );

				for ( const $child of $node.childNodes ) {
					_spy( $child, instance );
				}
			} break;
			case $node instanceof Text: {
				const parent = instance.map.get( $node.parentElement );
				const o = new RenderText( $node, instance );

				if ( parent ) parent.children.add( o );

				instance.map.set( $node, o );
			} break;
		}
	}

	function _unspy( $node, instance ) {
		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = instance.map.get( $node.parentElement );
				const o = instance.map.get( $node );

				if ( !o ) return;

				for ( const child of o.children ) {
					_unspy( child.$node, instance );
				}

				o.destructor();

				if ( parent ) parent.children.delete( o );
				
				instance.map.delete( $node, o );
			} break;
			case $node instanceof Text: {
				const parent = instance.map.get( $node.parentElement );
				const o = instance.map.get( $node );

				if ( !o ) return;

				o.destructor();

				if ( parent ) parent.children.delete( o );

				instance.map.delete( $node, o );
			} break;
		}
	}

	function _detectChanges( instance ) {
		const step = delta => {
			if ( instance.isDestroyed ) return;

			if ( instance.isChanged ) {
				instance.isChanged = false;
				instance.dom.render();
			}

			window.requestAnimationFrame( step );
		};

		window.requestAnimationFrame( step );
	}

	function _dispatch( name, detail ) {
		const options = { detail, bubbles: true };
		const event = new CustomEvent( name, options );
		
		this.$node.dispatchEvent( event );
	}

})();