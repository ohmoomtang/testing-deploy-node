import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autoComplete from './autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autoComplete( $('#address'),$('#lng'),$('#lat') );

typeAhead( $('.search') );

makeMap ( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);