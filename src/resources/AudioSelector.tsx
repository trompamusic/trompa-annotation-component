import React from 'react';
import {ChangeEvent, Component} from "react";
import {Button, Col, Form, Row} from "react-bootstrap-v5";
import TrompaClient from "../API/CEAPI";



type Props = {
    trompaClient: TrompaClient;
    onSelect: (node: { source: string }) => void;
};
type State = {
    nodeid: string;
    result: string;
};

export default class AudioSelector extends Component<Props, State> {
    state = {
        nodeid: "7c338222-6c68-45ce-a1aa-f2a41a261520",
        result: ""
    };

    onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        this.setState({nodeid: e.target.value});
    };

    searchNode = async (): Promise<void> => {
        console.debug(`Hello ${this.state.nodeid}`)
        try {
            const response = await this.props.trompaClient.getThingById(this.state.nodeid);
            console.debug("Apollo response:", response);
            if (response?.data?.ThingInterface?.length) {
                this.setState({result: `You selected ${response.data.ThingInterface[0].contentUrl}`});
                // Send the resource back to the parent component
                this.props.onSelect({source: response.data.ThingInterface[0].contentUrl});
            } else {
                this.setState({result: "No item with this id"});
            }
        } catch (error) {
            this.setState({result: `Error! ${error}`});
        }
    }

    render() {
        return (
            <div>
                <Row className="align-items-center">
                    <Col>
                        <Form.Group controlId="exampleForm.ControlInput1">
                            <Form.Control placeholder="CE uuid" value={this.state.nodeid}
                                          onChange={this.onInputChange}/>
                        </Form.Group>
                    </Col>
                    <Col xs="auto">
                        <Button type="submit" className="mb-2" onClick={this.searchNode}>
                            Submit
                        </Button>
                    </Col>
                </Row>
                {this.state.result}
            </div>
        )
    }
}