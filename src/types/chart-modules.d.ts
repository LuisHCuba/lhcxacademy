declare module 'chart.js' {
  export const Chart: any;
  export const CategoryScale: any;
  export const LinearScale: any;
  export const BarElement: any;
  export const Title: any;
  export const Tooltip: any;
  export const Legend: any;
  export const ArcElement: any;
  export const PointElement: any;
  export const LineElement: any;
  export function register(...components: any[]): void;
}

declare module 'react-chartjs-2' {
  export class Bar extends React.Component<any, any> {}
  export class Pie extends React.Component<any, any> {}
  export class Line extends React.Component<any, any> {}
} 