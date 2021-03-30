import {Nav, Navbar} from "react-bootstrap-v5";
import {LoggedIn, LoggedOut, LoginButton, LogoutButton, Value} from "@solid/react";
import React from "react";

export default function Navigation() {
    return (
        <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">Annotation demo</Navbar.Brand>
            <Nav className="me-auto">
                <LoggedIn>Logged in: <Value src="user.name" /> <LogoutButton/></LoggedIn>
                <LoggedOut>
                    <LoginButton className="btn btn-success ml-auto mr-1" popup="auth-popup.html">Login</LoginButton>
                </LoggedOut>
            </Nav>
        </Navbar>
    );
}