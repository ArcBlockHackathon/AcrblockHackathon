import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { dataSources, getClient } from '../../libs/ocap';
import Layout from '../../components/Layout';
import Loading from '../../components/Loading';

import './style.css';

let CanvasJSReact = require('../../libs/canvasjs.react');
let CanvasJSChart = CanvasJSReact.CanvasJSChart;

class Hackathon extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataSource: dataSources[1],
      message: null,
      timestamp: null,
      subscribed: false,
      ethPrice: [],
      minerPie: [],
      blockSum: 0
    };
    }

  async componentDidMount() {
    const client = getClient(this.state.dataSource.name);

    // Subscription
    const subscription = await client.newBlockMined();
    subscription.on('data', data => {
      const date = new Date();
        this.state.ethPrice.push({
        x: date,
        y: data["newBlockMined"]["priceInUsd"]
      });

      // Increase miner by 1
      let miner = data["newBlockMined"]["extraDataPlain"].toString();
      miner = miner.split("-")[0];
      if (miner === "" || miner === " ") {
        miner = "Normal Person";
      }

      let found = false;
      for (let i = 0; i < this.state.minerPie.length; i++) {
        if (this.state.minerPie[i].name === miner) {
          this.state.minerPie[i].y += 1;
          found = true;
          break;
        }
      }
      if (!found) {
        this.state.minerPie.push({
          name: miner,
          y: 1
        });
      }

      const blockSum = this.state.blockSum;
      this.setState({
        message: data["newBlockMined"],
        timestamp: date,
        blockSum: blockSum + 1
      });
    });
    this.setState({ subscribed: true});
  }

  render() {
    const { subscribed, message, timestamp, dataSource, ethPrice, minerPie, blockSum} = this.state;

    const minerDoughnut = {
      animationEnabled: true,
      title: {
        text: "Miner Distribution"
      },
      subtitles: [{
        text: "Miner Pie",
        verticalAlign: "center",
        fontSize: 24,
        dockInsidePlotArea: true
      }],
      data: [{
        type: "doughnut",
        showInLegend: true,
        indexLabel: "{name} ({percentage}%)",
        toolTipContent: "<b>{name}</b>: {y} <b> block(s)</b>",
        yValueFormatString: "#",
        dataPoints: minerPie
      }]
    };

    //calculate percentage
    let dataPoint = minerDoughnut.data[0].dataPoints;
    for(let i = 0; i < dataPoint.length; i++) {
      minerDoughnut.data[0].dataPoints[i].percentage = ((dataPoint[i].y / blockSum) * 100).toFixed(2);
    }

    const ethPriceChart = {
      animationEnabled: true,
      exportEnabled: true,
      theme: "light2", // "light1", "dark1", "dark2"
      title:{
        text: "ETH Price Chart"
      },
      axisY: {
        title: "Price",
        includeZero: false,
      },
      axisX: {
        title: "Time",
        interval: 10
      },
      data: [{
        type: "line",
        toolTipContent: "'$'{y}",
        dataPoints: ethPrice
      }]
    };

    return (
      <Layout>
        <h2>
          Hackathon Demo: ETH price and miner visualization
        </h2>

        {subscribed || (
          <p>
            Try to subscribe to {dataSource.name.toUpperCase()}.newBlockMined
          </p>
        )}
        {subscribed && (
          <p>
            {dataSource.name.toUpperCase()}.newBlockMined subscription success
          </p>
        )}

        {subscribed &&
        !message && (
          <div>
            <p>waiting for data</p>
            <Loading />
          </div>
        )}

        {message && (
          <div>
            <p>
              New {dataSource.name.toUpperCase()} blocked mined at{' '}
              {timestamp.toString()}:
            </p>
          </div>
        )}

        {message && (
          <div>
            <CanvasJSChart options = {ethPriceChart}/>
          </div>
        )}

        {message && (
          <div>
            <CanvasJSChart options = {minerDoughnut}/>
          </div>
        )}
      </Layout>
    );
  }
}
export default withRouter(Hackathon);
