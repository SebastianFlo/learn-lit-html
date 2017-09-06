// require('lit-html');
import { html } from 'lit-html';
window.onload = function(e) { 
    const foo = 'the shit';
    const render = () => html`<h1>foo is ${foo}</h1>`;
    document.body.appendChild(render().template.element.content.cloneNode(true));
}