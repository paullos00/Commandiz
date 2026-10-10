export type MenuItem = {
  id: string;
  title: string;
  desc: string;
  price: number;
  category: string;
  image: any;
};

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', title: 'Kafta', desc: 'Delicioso espeto de kafta.', price: 9, category: 'Carnes', image: require('../assets/images/kafta.jpg') },
  { id: '2', title: 'Kafta com Queijo', desc: 'Recheio de queijo, combinação perfeita.', price: 9, category: 'Carnes', image: require('../assets/images/kaftaqueijo.jpg') },
  { id: '3', title: 'Picanha', desc: 'Corte especial, preço especial.', price: 20, category: 'Carnes', image: require('../assets/images/picanha.jpg') },
];

export const CATEGORIES = ['Carnes', 'Frango', 'Bebidas'];

export const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;