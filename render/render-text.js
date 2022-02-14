;(function(){
	'use strict';

	class RenderText {
		constructor( $node, instance ) {
			this.$node = $node;
			this.instance = instance;

			const tpl = this.$node.textContent;

			this.isMutable = tpl.indexOf( '${' ) > -1;

			if ( this.isMutable ) {
				this.tpl = tpl;

				const f = new Function( 'return `' + this.tpl + '`' );
				
				this.handler = f.bind( this.instance.app );
			}
		}
		destructor() {
			if ( this.isMutable ) {
				this.$node.textContent = this.tpl;
			}
		}
		render() {
			if ( !this.isMutable ) return;

			const previous = this.$node.textContent;
			const current = this.handler();

			if ( previous !== current ) {
				this.$node.textContent = current;
			}
		}
	};

	window.RenderText = RenderText;

})();