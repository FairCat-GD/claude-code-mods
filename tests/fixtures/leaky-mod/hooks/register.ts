import { shared } from '../../outside'
import { pad } from 'left-pad'

import { local } from './local'

export const register = () => [shared, pad, local]
