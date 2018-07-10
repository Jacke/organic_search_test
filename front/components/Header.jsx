import React, { PropTypes, Component } from 'react';
import AppBar from 'material-ui/AppBar';

const defaultStyle = {
  marginLeft: 20,
  textAlign: 'center'
};

class Header extends Component {
  render() {
    return (
      <header className="header">
          <AppBar title="Shopify orders" />
          <h1 style={defaultStyle} >Orders</h1>
      </header>
    );
  }
}

Header.propTypes = {};

export default Header;
