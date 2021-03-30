import { gql, useQuery } from '@apollo/client';

import React, {ChangeEvent, Component} from "react";
import {Button, Col, Form, Row} from "react-bootstrap-v5";

const GET_ITEM = gql`
  query ThingInterface($id: ID!) {
    ThingInterface(identifier: $id) {
      __typename
      identifier
      source
      name
      title
      ... on MediaObjectInterface {
          contentUrl
      }
      ... on AudioObject {
          contentUrl
      }
    }
  }
`;

type AudioObjectUrlProps = {identifier: String};
function AudioObjectUrl({ identifier }: AudioObjectUrlProps) {
    const { loading, error, data } = useQuery(GET_ITEM, {
        variables: { id: identifier },
    });
    if (loading) return null;
    if (error) return `Error! ${error}`;

    if (data.ThingInterface.length) {
        return data.ThingInterface[0].contentUrl;
    } else {
        return "No item with this id"
    }
}

type State = {
    nodeid: string;
    doSearch: boolean;
};

export class AudioSelector extends Component<any, State> {
    state = {
        nodeid: "7c338222-6c68-45ce-a1aa-f2a41a261520",
        doSearch: false
    };

    onChange = (e: ChangeEvent<HTMLInputElement>): void => {
        this.setState({ nodeid: e.target.value, doSearch: false});
    };

    searchNode() {
        console.debug(`Hello ${this.state.nodeid}`)
        this.setState({doSearch: true});
    }

    render() {
        return (
            <div>
            <Row className="align-items-center">
                <Col>
                    <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Control placeholder="CE uuid" value={this.state.nodeid} onChange={this.onChange} />
                    </Form.Group>
                </Col>
                <Col xs="auto">
                    <Button type="submit" className="mb-2" onClick={() => this.searchNode()}>
                        Submit
                    </Button>
                </Col>
            </Row>
                {this.state.doSearch ? <span><AudioObjectUrl identifier={this.state.nodeid}/></span> : ''}
            </div>
        )
    }
}