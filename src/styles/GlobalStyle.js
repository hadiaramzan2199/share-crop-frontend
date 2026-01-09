import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Roboto', sans-serif;
    background-color: #f0f2f5;
    color: #333;
    overflow-x: hidden;
    overflow-y: auto;
    height: auto;
    min-height: 100vh;
  }
  
  #root {
    min-height: 100vh;
    overflow-y: auto;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #222;
  }

  a {
    text-decoration: none;
    color: #1a73e8;
  }

  button {
    cursor: pointer;
  }
`;

export default GlobalStyle;