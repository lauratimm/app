import { bool, func, object, string } from 'prop-types'
import React from 'react'
import Helmet from 'react-helmet'
import { intlShape } from 'react-intl'
import styled from 'styled-components'

import Footer from '../Footer'
import NavBar from '../NavBar'
import Notification from '../../containers/Notification'
import Spinner from '../Spinner'
import TopBar from '../../containers/TopBar'
import Wrp from '../Wrapper'

import Details from './Details'
import messages from './messages'

const Wrapper = styled(Wrp)`padding-bottom: 0;`

export default class Mapathon extends React.Component {
  static propTypes = {
    loadingMapathon: bool.isRequired,
    mapathon: object.isRequired,
    notificationMessage: string.isRequired,
    sendingRequest: bool.isRequired,
    getMapathon: func.isRequired,
    clearState: func.isRequired
  }

  static contextTypes = {
    intl: intlShape
  }

  componentWillMount() {
    this.props.getMapathon()
  }

  componentWillUnmount() {
    this.props.clearState()
  }

  render() {
    const formatMessage = this.context.intl.formatMessage

    let pageTitle = <Helmet title={formatMessage(messages.defaultPageTitle)} />
    if (!this.props.loadingMapathon && this.props.mapathon.id) {
      pageTitle = (
        <Helmet
          title={formatMessage(messages.detailsPageTitle, {
            mapathonName: this.props.mapathon.name
          })}
        />
      )
    } else if (!this.props.loadingMapathon && !this.props.mapathon.id) {
      pageTitle = <Helmet title={formatMessage(messages.notFoundPageTitle)} />
    }

    const headerTitle = formatMessage(messages.detailsHeader)

    const container = (
      <Details
        {...this.props.mapathon}
        sendingRequest={this.props.sendingRequest}
      />
    )

    return (
      <Wrapper>
        {pageTitle}

        <TopBar hideOn="phone,tablet" />

        <NavBar
          hideOn="desktop,widescreen"
          isNarrow
          backURL="/mapathons"
          title={headerTitle}
        />

        {this.props.notificationMessage ? (
          <Notification
            message={this.context.intl.formatMessage(
              messages[this.props.notificationMessage]
            )}
          />
        ) : null}

        {this.props.loadingMapathon ? <Spinner /> : container}

        <Footer hideOn="phone,tablet" isNarrow />
      </Wrapper>
    )
  }
}
