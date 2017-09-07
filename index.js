// require('lit-html');
import { html, render } from 'lit-html';

window.onload = function() { 
    const title = 'Lit-HTML';
    const foo = 'the shit';
    const header = html`<h1>${title}</h1>`;
    const helloTemplate = (name) => html`${header}<h1>foo is ${foo}</h1>`;
    render(helloTemplate('Steve'), document.body);
}

