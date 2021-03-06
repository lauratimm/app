import { bool, func, object, string } from 'prop-types'
import React from 'react'
import ReactGA from 'react-ga'
import Helmet from 'react-helmet'
import { intlShape } from 'react-intl'
import styled from 'styled-components'

import Footer from '../Footer'
import NavBar from '../NavBar'
import Spinner from '../Spinner'
import TopBar from '../../containers/TopBar'
import Wrp from '../Wrapper'

import messages from './messages'
import Review from './Review'

const Wrapper = styled(Wrp)`padding-bottom: 0;`

export default class CreateReview extends React.Component {
  static propTypes = {
    match: object.isRequired,
    loadingVenue: bool.isRequired,
    venue: object.isRequired,
    history: object.isRequired,
    errors: object.isRequired,
    userData: object.isRequired,
    photo: string.isRequired,
    sendingRequest: bool.isRequired,
    getVenue: func.isRequired,
    clearState: func.isRequired,
    setNotificationMessage: func.isRequired,
    clearError: func.isRequired,
    createPhoto: func.isRequired,
    deletePhoto: func.isRequired,
    createReview: func.isRequired
  }

  static contextTypes = {
    intl: intlShape
  }

  componentWillMount() {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }

  componentDidMount() {
    this.props.getVenue(this.props.match.params.placeId)
  }

  componentWillUnmount() {
    this.props.clearState()
  }

  render() {
    const formatMessage = this.context.intl.formatMessage

    let pageTitle = <Helmet title={formatMessage(messages.defaultPageTitle)} />
    if (!this.props.loadingVenue && !this.props.venue.placeId) {
      pageTitle = <Helmet title={formatMessage(messages.notFoundPageTitle)} />
    }

    const headerTitle = formatMessage(messages.createReviewHeader)

    return (
      <Wrapper>
        {pageTitle}

        <TopBar hideOn="phone,tablet" />

        <NavBar
          hideOn="desktop,widescreen"
          isNarrow
          title={headerTitle}
          goBackHandler={() => this.props.history.goBack()}
        />

        {this.props.loadingVenue ? (
          <Spinner />
        ) : (
          <Review
            userData={this.props.userData}
            venue={this.props.venue}
            errors={this.props.errors}
            photo={this.props.photo}
            sendingRequest={this.props.sendingRequest}
            setNotificationMessage={this.props.setNotificationMessage}
            clearError={this.props.clearError}
            createPhoto={this.props.createPhoto}
            deletePhoto={this.props.deletePhoto}
            createReview={this.props.createReview}
          />
        )}

        <Footer hideOn="phone,tablet" isNarrow />
      </Wrapper>
    )
  }
}
