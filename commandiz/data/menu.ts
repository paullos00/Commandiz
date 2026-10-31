export type MenuItem = {
  id: string;
  title: string;
  desc: string;
  price: number;
  category: string;
  image: any;
};

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', title: 'Kafta', desc: 'Delicioso espeto de kafta.', price: 9, category: 'Carnes', image: require('../assets/images/kafta.jpg')},
  { id: '2', title: 'Kafta com Queijo', desc: 'Recheio de queijo, combinação perfeita.', price: 9, category: 'Carnes', image: require('../assets/images/kaftaqueijo.jpg')},
  { id: '3', title: 'Picanha', desc: 'Corte especial, preço especial.', price: 12, category: 'Carnes', image: require('../assets/images/picanha.jpg')},
  { id: '4', title: 'Asinha', desc: 'Asinhas assadas e deliciosas', price: 9, category: 'Frango', image: require('../assets/images/asinha.jpg')},
  { id: '5', title: 'Coca-Cola', desc: 'Coca-cola lata', price: 12, category: 'Bebidas', image: require('../assets/images/cocacola.jpg')},
  { id: '6', title: 'Suco de Laranja', desc: 'Suco de laranja da Kapo', price: 12, category: 'Bebidas', image: require('../assets/images/sucolaranja.jpg')},
  { id: '7', title: 'Jantinha', desc: 'Jantinha Premium', price: 26, category: 'Refeições', image: require('../assets/images/jantinha.jpg')},
  { id: '8', title: 'Pão com Espeto', desc: 'Pão Delicioso, com seu Espeto Preferido', price: 19, category: 'Refeições', image: require('../assets/images/pao.jpg')},
];

export const CATEGORIES = ['Carnes', 'Frango', 'Bebidas', 'Refeições'];

export const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;