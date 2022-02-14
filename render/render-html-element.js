;(function(){
	'use strict';

	const STATE = {
		regexp: {
			attr: /^[@:].*$/,
		},
	};

	class RenderHTMLElement {
		constructor( $node, instance ) {
			this.$node = $node;
			this.instance = instance;
			this.children = new Set();
			this.listeners = [];
			this.attrs = { props: {}, events: {} };

			if ( this.$node !== instance.$node ) {
				this.attrs = _processAttributes( this.$node, this.instance );

				for ( const name in this.attrs.events ) {
					_addEventListener( this, name );
				}
			}
		}
		destructor() {
			for ( const name in this.attrs.events ) {
				_removeEventListener( this, this.$node, this.instance, name );
			}

			this.attrs.events = {};
		}
		render() {
			for ( const name in this.attrs.props ) {
				const prop = this.attrs.props[ name ];
				const value = prop.handler();

				if ( prop.value !== value ) {
					prop.value = value;
					_applyProperty( this.$node, name, value );
				}
			}

			for ( const child of this.children ) {
				child.render();
			}
		}
	};

	window.RenderHTMLElement = RenderHTMLElement;

	function _processAttributes( $node, instance ) {
		const attrs = {};

		for ( const attr of $node.attributes ) {
			if ( STATE.regexp.attr.test( attr.name ) ) {
				attrs[ attr.name ] = attr.value;
			}
		}

		const events = {};
		const props = {};

		for ( const name in attrs ) {
			const value = attrs[ name ];

			switch ( true ) {
				case name.indexOf( '@' ) === 0: {
					const splitted = name.split( '.' );
					const eventName = splitted[0].substr( 1 );
					const modifiers = splitted.splice( 1 );
					const { handler, options } = _processModifiers( $node, instance, value, modifiers );

					events[ eventName ] = { handler, modifiers, options };
				} break;
				case name.indexOf( ':' ) === 0: {
					const f = new Function( '', `return ${value}` );
					const propName = name.substr( 1 );

					props[ propName ] = {
						handler: e => f.call( instance.app ),
						value: undefined,
					};
				} break;
			}
		}

		return { events, props };
	}

	function _addEventListener( self, name ) {
		const args = self.attrs.events[ name ];

		self.$node.addEventListener( name, args.handler, args.options );
	}

	function _removeEventListener( self, $node, instance, name ) {
		const args = self.attrs.events[ name ];
		
		self.$node.removeEventListener( name, args.handler, args.options );
	}

	function _processModifiers( $node, instance, value, modifiers ) {
		const options = {};
		const f = new Function( '$event', `return ${value}` );

		let handler = e => {
			if ( e instanceof CustomEvent ) {
				f.call( instance.app, e.detail );
			} else {
				for ( const $node of e.path ) {
					if ( !( $node instanceof HTMLElement ) ) continue;
					if ( $node.tagName.indexOf('APP-') !== 0 ) continue;
					if ( $node === instance.$node ) { break; } else { return; }
				}

				f.call( instance.app, e );
			}
		};
		
		for ( const modifier of modifiers ) {
			switch ( modifier ) {
				case 'capture': { options.capture = true; } break;
				case 'once': { options.once = true; } break;
				case 'passive': { options.passive = true; } break;
				case 'prevent': {
					const h = handler;
					handler = e => { e.preventDefault(); h( e ) };
				} break;
				case 'stop': {
					const h = handler;
					handler = e => { e.stopPropagation(); h( e ) };
				} break;
				case 'self': {
					const h = handler;
					handler = e => { if ( e.target !== $node ) return; h( e ) };
				} break;
			}
		}

		return { handler, options };
	}

	function _applyProperty( $node, name, value ) {
		switch ( name ) {
			case 'class': {
				_applyPropertyClass( $node, name, value );
			} break;
			case 'style': {
				_applyPropertyStyle( $node, name, value );
			} break;
			case 'allowfullscreen':
			case 'allowpaymentrequest':
			case 'async':
			case 'autofocus':
			case 'autoplay':
			case 'checked':
			case 'contenteditable':
			case 'controls':
			case 'default':
			case 'disabled':
			case 'formnovalidate':
			case 'hidden':
			case 'ismap':
			case 'itemscope':
			case 'loop':
			case 'multiple':
			case 'muted':
			case 'nomodule':
			case 'novalidate':
			case 'open':
			case 'playsinline':
			case 'readonly':
			case 'required':
			case 'reversed':
			case 'selected':
			case 'truespeed': {
				$node[ name ] = !!value;
			} break;
			default: {
				$node.setAttribute( name, `${value}` );
			} break;
		}
	}

	function _applyPropertyClass( $node, name, value ) {
		switch ( true ) {
			case value instanceof Object: {
				const data = [];

				for ( const key in value ) {
					if ( !!value[ key ] ) data.push( key );
				}

				$node.setAttribute( name, data.join( ' ' ) );
			} break;
			case value instanceof Array: {
				// todo: class attr from array
			} break;
			case typeof value === 'string': {
				$node.setAttribute( name, value );
			} break;
			default: {
				throw 'incorrect :class value';
			} break;
		}
	}

	function _applyPropertyStyle( $node, name, value ) {
		switch ( true ) {
			case value instanceof Object: {
				const pairs = [];

				for ( const key in value ) {
					pairs.push( `${key}:${value[ key ]}` );
				}

				$node.setAttribute( name, pairs.join( ';' ) );
			} break;
			case value instanceof Array: {
				// todo: style attr from array
			} break;
			case typeof value === 'string': {
				$node.setAttribute( name, value );
			} break;
			default: {
				throw 'incorrect :style value';
			} break;
		}
	}

})();