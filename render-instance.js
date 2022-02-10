;(function(){
	'use strict';

	class RenderInstance {
		constructor( args ) {
			this.$node = document.querySelector( args.selector );

			if ( !( this.$node instanceof HTMLElement ) ) {
				throw 'incorrect selector';
			}

			this.declaration = { ...args };
			this.app = _createAppProxy( this.declaration, this );

			this.dom = new RenderHTMLElement( this.$node, this );

			this.map = new WeakMap();
			this.map.set( this.$node, this.dom );

			this.isChanged = true;
			this.isDestroyed = false;

			for ( const $child of this.$node.childNodes ) {
				_spy( $child, this );
			}

			this.observer = _createObserver( this );

			this.observer.observe( this.$node, {
				childList: true,
				subtree: true,
			});

			const step = delta => {
				if ( this.isDestroyed ) return;

				if ( this.isChanged ) {
					this.isChanged = false;
					this.dom.render();
				}

				window.requestAnimationFrame( step );
			};

			window.requestAnimationFrame( step );
		}
		destructor() {
			this.isDestroyed = true;

			this.observer.disconnect();
		}
	};

	window.RenderInstance = RenderInstance;

	function _createAppProxy( declaration, instance ) {
		let proxy = undefined;

		proxy = new Proxy( declaration, {
			get: ( target, name ) => {
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
					target.props[ name ] = value;
					instance.isChanged = true;
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

	function _spy( $node, instance ) {
		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = instance.map.get( $node.parentNode );
				const o = new RenderHTMLElement( $node, instance );

				parent.children.add( o );
				instance.map.set( $node, o );

				for ( const $child of $node.childNodes ) {
					_spy( $child, instance );
				}
			} break;
			case $node instanceof Text: {
				const parent = instance.map.get( $node.parentNode );
				const o = new RenderText( $node, instance );

				parent.children.add( o );
				instance.map.set( $node, o );
			} break;
		}
	}

	function _unspy( $node, instance ) {
		switch ( true ) {
			case $node instanceof HTMLElement: {
				const parent = instance.map.get( $node.parentNode );
				const o = instance.map.get( $node );

				for ( const child of o.children ) {
					_unspy( child.$node, instance );
				}

				o.destructor();

				parent.children.delete( o );
				instance.map.delete( $node, o );
			} break;
			case $node instanceof Text: {
				const parent = instance.map.get( $node.parentNode );
				const o = instance.map.get( $node );

				o.destructor();

				parent.children.delete( o );
				instance.map.delete( $node, o );
			} break;
		}
	}

})();