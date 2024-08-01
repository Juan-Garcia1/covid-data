import "./App.css";
import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  BarChart,
  Bar,
} from "recharts";
import Loader from "./Components/Loader";

function App() {
  const [covidData, setCovidData] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCovidData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://disease.sh/v3/covid-19/historical/all?lastdays=all"
      );
      if (!response.ok) {
        throw new Error(
          `${response.status}. There was a problem hitting the endpoint.`
        );
      }

      const data = await response.json();
      const covidData = aggregateMonthlyData({ data });

      setCovidData(covidData);
    } catch (error) {
      console.log(error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>
            <strong>{label}</strong>
          </p>
          <p className="label">
            <strong>{`${payload[0].name}`}</strong> :{" "}
            {`${formatNumber({
              number: payload[0].value,
            })}`}
          </p>
          <p className="label">
            <strong>{`${payload[1].name}`}</strong> :{" "}
            {`${formatNumber({
              number: payload[1].value,
            })}`}
          </p>
        </div>
      );
    }

    return null;
  };

  const CustomizedAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#fff">
          {shortenNumber({ number: payload.value })}
        </text>
      </g>
    );
  };

  /**
   * e.g. 10000 -> 10k
   *
   * @param {object} opts
   * @param {number} opts.number
   * @returns string
   */
  const shortenNumber = (opts = {}) => {
    if (isNaN(opts.number) || opts.number === 0) {
      return;
    }

    const shortenNumber = new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(opts.number);

    return shortenNumber;
  };

  /**
   * e.g 1000 -> 1,000
   *
   * @param {object} opts
   * @param {string} opts.number
   * @returns string
   */
  const formatNumber = (opts = {}) => {
    return opts.number.toLocaleString();
  };
  /**
   *
   * @param {object} opts
   * @param {object} opts.data
   * @returns [{ date: string, cases: string, deaths: string }]
   */
  const aggregateMonthlyData = (opts = {}) => {
    const result = {};

    Object.keys(opts.data.cases).forEach((date) => {
      const splitDate = date.split("/");
      const month = splitDate[0];
      const year = splitDate[2];
      const monthYear = `${month}/${year}`;

      if (!result[monthYear]) {
        result[monthYear] = { cases: 0, deaths: 0 };
      }

      result[monthYear].cases += opts.data.cases[date];
      result[monthYear].deaths += opts.data.deaths[date];
    });

    return Object.keys(result).map((key) => ({
      date: key,
      cases: result[key].cases,
      deaths: result[key].deaths,
    }));
  };

  useEffect(() => {
    fetchCovidData();
  }, []);

  return (
    <div className="App">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="container">
          <h1 className="title">Covid 19</h1>
          <p className="summary">
            The bar chart provides a visual representation of the COVID-19
            impact, illustrating both the number of <span>confirmed cases</span>{" "}
            and the number of <span>deaths</span>. It highlights the significant
            disparity between the two metrics, showcasing the{" "}
            <span>widespread</span> prevalence of the virus while also
            emphasizing the severe outcomes in terms of mortality. This
            comparison underscores the <span>critical</span> importance of
            public health measures and vaccinations in mitigating the pandemic's
            effects.
            <br />
            Source: <a href="https://disease.sh/">https://disease.sh/</a>
          </p>
          {hasError ? (
            <p className="error-message">
              Something went wrong. Check again at a later time
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={400} fill="#ff">
              <BarChart
                width={500}
                height={300}
                data={covidData}
                syncId="covid"
                margin={{
                  top: 30,
                  right: 0,
                  left: 0,
                  bottom: 30,
                }}
              >
                <CartesianGrid
                  strokeDasharray="0 0"
                  stroke="rgba(242, 242, 242, .1)"
                />
                <XAxis dataKey="date" tick={{ fill: "#fff" }}>
                  <Label value="Months" position="bottom" fill="#fff" />
                </XAxis>
                <YAxis tick={<CustomizedAxisTick />}>
                  <Label
                    value="Total"
                    position="insideLeft"
                    fill="#fff"
                    angle={-90}
                  />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={40} />
                <Bar dataKey="cases" fill="#FF00CA" />
                <Bar type="monotone" dataKey="deaths" fill="#B400FF" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
