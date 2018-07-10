import React, { Component, PropTypes } from 'react';
import Footer from './Footer';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import Moment from 'react-moment';
import asyncPoll from 'react-async-poll';

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto'
  },
  table: {
    minWidth: 700
  }
});

const defaultStyle = {
  width: '80%',
  marginLeft: 20,
  margin: '0 auto'
};


class MainSection extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {data: []};
  }

  fetchOrders() {
      fetch('https://f0413c07.ngrok.io/api/v1/orders').then((data) => {
        let parsedData = data.json();
        parsedData.then(data => {
          console.log(data);
          this.setState({data: data});
          console.log(this.state);
        })
      })
  }

  componentDidMount() { setInterval(() => this.fetchOrders(), 3000) }

  render() {
    const { data } = this.state;
    const { classes } = this.props;

    return (
      <section className="main" style={defaultStyle}>
      <Paper className={classes.root}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell numeric>Currency</TableCell>
            <TableCell numeric>Payment status</TableCell>
            <TableCell numeric>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(n => {
            return (
              <TableRow key={n.id}>
                <TableCell component="th" scope="row">
                  {n.name}
                </TableCell>
                <TableCell numeric>{n.currency}</TableCell>
                <TableCell numeric>{n.financial_status === 'paid' ? '+' : '-'}</TableCell>
                <TableCell numeric><Moment date={n.created_at} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
      </section>
    );
  }
}

MainSection.propTypes = {
  classes: PropTypes.object.isRequired 
};

export default withStyles(styles)(MainSection);