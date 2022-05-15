// Copyright 2022 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Button, Col, Row} from "antd";
import { SendOutlined } from '@ant-design/icons';
import * as RoomBackend from "./backend/RoomBackend";
import * as Setting from "./Setting";
import { LiveKitRoom } from 'livekit-react';
import 'livekit-react/dist/index.css';
import "react-aspect-ratio/aspect-ratio.css";
import i18next from "i18next";

class Room extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      userName: props.match?.params.userName,
      roomName: props.match?.params.roomName,
      room: null,
      isConnected: false,
    };
  }

  componentWillMount() {
    this.getRoom();
  }

  getRoom() {
    RoomBackend.getRoom(this.state.userName, this.state.roomName)
      .then((room) => {
        this.setState({
          room: room,
        });
      });
  }

  onGetRoom() {
    this.props.onGetRoom();
  }

  getAccountToken(room) {
    const participant = room.participants.filter(participant => participant.name === this.props.account.name)[0];
    if (participant === undefined) {
      return "";
    }

    return participant.token;
  }

  getPropsOrStateRoom() {
    return this.props.room !== undefined ? this.props.room : this.state.room;
  }

  renderRoom() {
    const room = this.getPropsOrStateRoom();
    if (room === null) {
      return null;
    }

    const token = this.getAccountToken(room);
    if (token === "") {
      return (
        <div style={{width: "1307px", height: "740px", backgroundColor: "black", color: "white", fontSize: 40, textAlign: "center"}} >
          <div style={{paddingTop: "300px"}}>
            {
              room.status === "Started" ? i18next.t("room:The current meeting has started, please join in") :
                i18next.t("room:The current meeting has ended")
            }
          </div>
          <div style={{fontSize: 20}}>
            {i18next.t("room:There are already N participants in the meeting room.").replace("N", room.participants.length)}
          </div>
          <Button loading={this.state.isConnected && token === ""} type="primary" shape="round" icon={<SendOutlined />} size="large" onClick={() => {
            RoomBackend.joinRoom(room.owner, room.name)
              .then((res) => {
                if (res) {
                  this.setState({
                    isConnected: true,
                  });
                  this.onGetRoom();
                } else {
                  Setting.showMessage("error", `failed to save: server side failure`);
                }
              })
              .catch(error => {
                Setting.showMessage("error", `failed to save: ${error}`);
              });
          }}>{i18next.t("room:Join In")}</Button>
        </div>
      )
    }

    const onConnected = (room) => {
      room.localParticipant.setCameraEnabled(true);
      room.localParticipant.setMicrophoneEnabled(true);
    };

    return (
      <div className="roomContainer">
        <LiveKitRoom url={room.serverUrl} token={token} onConnected={room => {
          onConnected(room);
        }} onLeave={() => {
          RoomBackend.leaveRoom(room.owner, room.name)
            .then((res) => {
              if (res) {
                this.setState({
                  isConnected: false,
                });
                this.onGetRoom();
              } else {
                Setting.showMessage("error", `failed to save: server side failure`);
              }
            })
            .catch(error => {
              Setting.showMessage("error", `failed to save: ${error}`);
            });
        }}/>
      </div>
    )
  }

  render() {
    return (
      <div>
        <Row style={{width: "100%"}}>
          <Col span={!Setting.isMobile() ? 3 : 0}>
          </Col>
          <Col span={!Setting.isMobile() ? 18 : 24}>
            {/*{*/}
            {/*  JSON.stringify(this.state.isConnected)*/}
            {/*}*/}
            {/*<br/>*/}
            {/*{*/}
            {/*  JSON.stringify(this.getAccountToken(this.getPropsOrStateRoom()))*/}
            {/*}*/}
            {
              this.renderRoom()
            }
          </Col>
          <Col span={!Setting.isMobile() ? 3 : 0}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Room;
