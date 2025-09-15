import React from 'react';
import { gql, useQuery, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboard {
      categories
      kpis { id name values }
    }
  }
`;

// Secondary client for Python Strawberry endpoint
const pyClient = new ApolloClient({ uri: 'http://localhost:4001/graphql', cache: new InMemoryCache() });

// Local union type for series types used
type SeriesType = 'line' | 'spline' | 'area' | 'areaspline' | 'column' | 'bar';

const Card: React.FC<{ title: string; children: React.ReactNode; source: string; }> = ({ title, children, source }) => (
  <div style={{background:'#1b1f27',padding:'10px 12px 12px',borderRadius:12,display:'flex',flexDirection:'column',boxShadow:'0 2px 4px rgba(0,0,0,0.4)',position:'relative'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <div style={{fontSize:13,fontWeight:600,letterSpacing:.5}}>{title}</div>
      <span style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:'#242b35',color:'#7fb4ff',letterSpacing:.5}}>{source}</span>
    </div>
    <div style={{flex:1}}>{children}</div>
  </div>
);

// Updated chartOptions to accept dynamic type + conditional axis tweaks
const chartOptions = (cfg: { title: string; type: SeriesType; categories: string[]; seriesName: string; data: number[] }): Highcharts.Options => {
  const { title, type, categories, seriesName, data } = cfg;
  const isBar = type === 'bar';
  return {
    title: { text: undefined },
    credits: { enabled: false },
    chart: { backgroundColor: 'transparent', height: 260 },
    xAxis: !isBar ? { categories, labels:{ style:{ color:'#ccc', fontSize:'10px'}}, lineColor:'#333' } : undefined,
    yAxis: isBar ? { categories, title:{ text: undefined }, labels:{ style:{ color:'#ccc', fontSize:'10px'}}, gridLineColor:'#222' } : { title: { text: undefined }, gridLineColor:'#222', labels:{ style:{ color:'#888', fontSize:'10px'} } },
    legend: { enabled: true, itemStyle:{ color:'#ccc'}, itemHoverStyle:{ color:'#fff'} },
    tooltip: { shared: type !== 'bar', backgroundColor:'#111', borderColor:'#333' },
    plotOptions: { area: { fillOpacity: 0.15 }, areaspline: { fillOpacity: 0.2 }, series: { marker: { enabled: false } } },
    series: [{ type: type as any, name: seriesName, data, color: pickColor(type) }]
  };
};

// Simple color palette based on type
function pickColor(type: string) {
  switch(type) {
    case 'column': return '#ffbc0d';
    case 'line': return '#00b5ff';
    case 'area': return '#ff6f3c';
    case 'spline': return '#9d5bff';
    case 'bar': return '#3ddc97';
    case 'areaspline': return '#ff2e63';
    default: return '#ffbc0d';
  }
}

// Hook to fetch from Python endpoint independently
const PySection: React.FC = () => {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, { fetchPolicy: 'cache-first', client: pyClient });
  if (loading) return <div style={{padding:10}}>Loading...</div>;
  if (error) return <div style={{padding:10}}>Error: {error.message}</div>;
  const { categories, kpis } = data.dashboard;
  const m: Record<string, any> = {}; kpis.forEach((k: any) => m[k.id]=k);

  const cards: { id: string; label: string; type: SeriesType; }[] = [
    { id: 'laborCost', label: 'Labor Cost %', type: 'areaspline' },
    { id: 'foodCost', label: 'Food Cost %', type: 'column' },
    { id: 'waste', label: 'Waste $', type: 'spline' },
    { id: 'energy', label: 'Energy kWh', type: 'area' },
  ];
  return (
    <>
      {cards.map(c => (
        <Card key={c.id} title={c.label} source="Strawberry">
          <HighchartsReact highcharts={Highcharts} options={chartOptions({ title: c.label, type: c.type, categories, seriesName: c.label, data: m[c.id]?.values || [] })} />
        </Card>
      ))}
    </>
  );
};

const App: React.FC = () => {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, { fetchPolicy: 'cache-first' });
  if (loading) return <div style={{padding:40}}>Loading...</div>;
  if (error) return <div style={{padding:40}}>Error: {error.message}</div>;
  const { categories, kpis } = data.dashboard;
  const kpiMap: Record<string, any> = {}; kpis.forEach((k: any) => kpiMap[k.id]=k);

  const cards: { id: string; label: string; type: SeriesType; }[] = [
    { id: 'rev', label: 'Revenue', type: 'column' },
    { id: 'tx', label: 'Transactions', type: 'line' },
    { id: 'avgTicket', label: 'Avg Ticket', type: 'area' },
    { id: 'driveThru', label: 'Drive Thru %', type: 'spline' },
    { id: 'delivery', label: 'Delivery %', type: 'bar' },
    { id: 'csat', label: 'Customer Sat', type: 'areaspline' }
  ];

  return (
    <div style={{padding:'18px 22px 60px'}}>
      <h1 style={{margin:'4px 0 12px',fontSize:22,letterSpacing:.5}}>McDonalds KPI Dashboard</h1>
      <div style={{fontSize:12,opacity:.75,marginBottom:18}}>Yellow labels indicate data source (Apollo Node vs Strawberry Python)</div>
      <div style={{display:'grid',gap:18,gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))'}}>
        {cards.map(c => (
          <Card key={c.id} title={c.label} source="Apollo">
            <HighchartsReact highcharts={Highcharts} options={chartOptions({ title: c.label, type: c.type, categories, seriesName: c.label, data: kpiMap[c.id]?.values || [] })} />
          </Card>
        ))}
        <PySection />
      </div>
    </div>
  );
};

export default App;