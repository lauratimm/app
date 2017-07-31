import styled from 'styled-components'

import checkIcon from '../../images/check.svg'
import { colors } from '../../styles'

const Toggle = styled.button.attrs({
  type: 'button',
  'aria-pressed': props => props.active,
  onClick: props => props.handler
})`
  align-self: ${props => {
    if (props.left) {
      return 'flex-start'
    } else if (props.right) {
      return 'flex-end'
    }

    return 'center'
  }};
  position: relative;

  border: none;
  border-radius: 3px;
  box-shadow: none;
  height: 2em;
  margin-bottom: 1rem;
  padding: 0 0 0 2.5em;

  background-color: transparent;

  color: ${props => (props.active ? colors.secondary : colors.grey)};
  font-size: ${props => {
    if (props.small) {
      return '.8rem'
    }

    return '1rem'
  }};
  font-weight: bold;

  &:active,
  &:focus {
    outline: 2px solid ${colors.primary};
  }

  &::before {
    left: 0;
    position: absolute;
    top: 0;

    border: 1px solid ${props =>
      props.active ? colors.secondary : colors.grey};
    border-radius: 3px;
    height: 100%;
    width: 2em;

    background-image: url(${checkIcon});
    background-position: center;
    background-repeat: no-repeat;
    background-size: 1em;
    background-color: ${props =>
      props.active ? colors.secondary : 'transparent'};

    content: '';
  }
`

export default Toggle
