import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs'

import Editor from '../components/base/Editor'
import Prompts from '../components/modals/Prompts'
import KeyValueEditor from '../components/base/KeyValueEditor'
import RequestBodyEditor from '../components/RequestBodyEditor'
import RequestAuthEditor from '../components/RequestAuthEditor'
import RequestUrlBar from '../components/RequestUrlBar'
import Sidebar from '../components/Sidebar'
import EnvironmentEditModal from '../components/modals/EnvironmentEditModal'

import * as GlobalActions from '../actions/global'
import * as RequestGroupActions from '../actions/requestGroups'
import * as RequestActions from '../actions/requests'
import * as ModalActions from '../actions/modals'

import * as db from '../database'

// Don't inject component styles (use our own)
Tabs.setUseDefaultStyles(false);

class App extends Component {
  _renderPageBody (actions, activeRequest, activeResponse, tabs) {
    if (!activeRequest) {
      return <div></div>;
    }

    return (
      <div className="grid__cell grid grid--collapse">
        <section className="grid__cell section">
          <div className="grid--v wide">
            <div className="grid__cell grid__cell--no-flex section__header">
              <RequestUrlBar
                sendRequest={actions.requests.send}
                onUrlChange={url => {db.update(activeRequest, {url})}}
                onMethodChange={method => {db.update(activeRequest, {method})}}
                request={activeRequest}/>
            </div>
            <Tabs className="grid__cell grid--v section__body"
                  onSelect={i => actions.global.selectTab('request', i)}
                  selectedIndex={tabs.request || 0}>
              <TabList className="grid grid--start">
                <Tab><button className="btn btn--compact">Body</button></Tab>
                <Tab>
                  <button className="btn btn--compact no-wrap">
                    Params {activeRequest.params.length ? `(${activeRequest.params.length})` : ''}
                  </button>
                </Tab>
                <Tab><button className="btn btn--compact">Auth</button></Tab>
                <Tab>
                  <button className="btn btn--compact no-wrap">
                    Headers {activeRequest.headers.length ? `(${activeRequest.headers.length})` : ''}
                  </button>
                </Tab>
              </TabList>
              <TabPanel className="grid__cell">
                <RequestBodyEditor
                  onChange={body => {db.update(activeRequest, {body})}}
                  request={activeRequest}/>
              </TabPanel>
              <TabPanel className="grid__cell grid__cell--scroll--v">
                <div className="wide pad">
                  <KeyValueEditor
                    uniquenessKey={activeRequest._id}
                    pairs={activeRequest.params}
                    onChange={params => {db.update(activeRequest, {params})}}
                  />
                </div>
              </TabPanel>
              <TabPanel className="grid__cell grid__cell--scroll--v">
                <div className="wide pad">
                  <RequestAuthEditor
                    request={activeRequest}
                    onChange={authentication => {db.update(activeRequest, {authentication})}}
                  />
                </div>
              </TabPanel>
              <TabPanel className="grid__cell grid__cell--scroll--v">
                <div className="wide pad">
                  <KeyValueEditor
                    uniquenessKey={activeRequest._id}
                    pairs={activeRequest.headers}
                    onChange={headers => {db.update(activeRequest, {headers})}}
                  />
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </section>
        <section className="grid__cell section">
          <div className="grid--v wide">
            <header
              className="grid grid--center header text-center bg-light txt-sm section__header">
              <div className="tag success">
                <strong>{activeResponse && activeResponse.statusCode}</strong>&nbsp;SUCCESS
              </div>
              <div className="tag">TIME&nbsp;<strong>143ms</strong></div>
            </header>
            <Tabs className="grid__cell grid--v section__body"
                  onSelect={i => actions.selectTab('response', i)}
                  selectedIndex={tabs.response || 0}>
              <TabList className="grid grid--start">
                <Tab><button className="btn btn--compact">Preview</button></Tab>
                <Tab><button className="btn btn--compact">Raw</button></Tab>
                <Tab><button className="btn btn--compact">Headers</button></Tab>
              </TabList>
              <TabPanel className="grid__cell">
                <Editor
                  value={activeResponse && activeResponse.body || ''}
                  prettify={true}
                  options={{
                    mode: activeResponse && activeResponse.contentType || 'text/plain',
                    readOnly: true,
                    placeholder: 'nothing yet...'
                  }}
                />
              </TabPanel>
              <TabPanel className="grid__cell">
                <Editor
                  value={activeResponse && activeResponse.body || ''}
                  options={{
                    lineWrapping: true,
                    mode: 'text/plain',
                    readOnly: true,
                    placeholder: 'nothing yet...'
                  }}
                />
              </TabPanel>
              <TabPanel className="grid__cell grid__cell--scroll--v">
                <div className="wide">
                  <div className="grid--v grid--start pad">
                    {!activeResponse ? null : activeResponse.headers.map((h, i) => (
                      <div className="grid grid__cell grid__cell--no-flex selectable" key={i}>
                        <div className="grid__cell">{h.name}</div>
                        <div className="grid__cell">{h.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </section>
      </div>
    )
  }

  render () {
    const {actions, requests, responses, requestGroups, tabs, modals} = this.props;
    const activeRequest = requests.all.find(r => r._id === requests.active);
    const activeResponse = responses[activeRequest && activeRequest._id];

    return (
      <div className="grid bg-super-dark tall">
        <Prompts />
        {modals.map(m => {
          if (m.id === EnvironmentEditModal.defaultProps.id) {
            return (
              <EnvironmentEditModal
                key={m.id}
                requestGroup={m.data.requestGroup}
                onClose={() => actions.modals.hide(m.id)}
                onChange={rg => db.update(m.data.requestGroup, {environment: rg.environment})}
              />
            )
          } else {
            return null;
          }
        })}
        <Sidebar
          activateRequest={actions.requests.activate}
          changeFilter={actions.requests.changeFilter}
          addRequestToRequestGroup={requestGroup => db.requestCreate({parent: requestGroup._id})}
          toggleRequestGroup={requestGroup => db.update(requestGroup, {collapsed: !requestGroup.collapsed})}
          activeRequest={activeRequest}
          activeFilter={requests.filter}
          requestGroups={requestGroups.all}
          requests={requests.all}/>
        <div className="grid__cell grid--v">
          {/*<header className="header bg-light">
           <div className="header__content"><h1>Hi World</h1></div>
           </header>*/}
          {this._renderPageBody(actions, activeRequest, activeResponse, tabs)}
        </div>
      </div>
    )
  }
}

App.propTypes = {
  actions: PropTypes.shape({
    requests: PropTypes.shape({
      activate: PropTypes.func.isRequired,
      update: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired,
      send: PropTypes.func.isRequired,
      changeFilter: PropTypes.func.isRequired
    }),
    requestGroups: PropTypes.shape({
      remove: PropTypes.func.isRequired,
      update: PropTypes.func.isRequired,
      toggle: PropTypes.func.isRequired
    }),
    modals: PropTypes.shape({
      hide: PropTypes.func.isRequired
    }),
    global: PropTypes.shape({
      selectTab: PropTypes.func.isRequired
    })
  }).isRequired,
  requestGroups: PropTypes.shape({
    all: PropTypes.array.isRequired
  }).isRequired,
  requests: PropTypes.shape({
    all: PropTypes.array.isRequired,
    active: PropTypes.string // "required" but can be null
  }).isRequired,
  responses: PropTypes.object.isRequired,
  tabs: PropTypes.object.isRequired,
  modals: PropTypes.array.isRequired
};

function mapStateToProps (state) {
  return {
    actions: state.actions,
    requests: state.requests,
    requestGroups: state.requestGroups,
    responses: state.responses,
    tabs: state.tabs,
    modals: state.modals
  };
}

function mapDispatchToProps (dispatch) {
  return {
    actions: {
      global: bindActionCreators(GlobalActions, dispatch),
      modals: bindActionCreators(ModalActions, dispatch),
      requestGroups: bindActionCreators(RequestGroupActions, dispatch),
      requests: bindActionCreators(RequestActions, dispatch)
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

