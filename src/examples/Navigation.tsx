import {Nav, Navbar} from "react-bootstrap-v5";
import {LoggedIn, LoggedOut, LoginButton, LogoutButton, Value} from "@solid/react";
import {Link} from "react-router-dom";

export default function Navigation() {
    return (
        <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">Annotation demo</Navbar.Brand>
            <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Main app</Nav.Link>
                <Nav.Link as={Link} to="/kitchensink">Kitchen Sink</Nav.Link >
                <Nav.Link as={Link} to="/editors/vocabulary">Fixed Vocabulary editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/rating">Rating editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/toolkit">Toolkit editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/motivation">Motivation editor</Nav.Link>
            </Nav>
            <Nav>
                <LoggedIn>
                    <Navbar.Text>
                        Logged in: <Value src="user.name"/>
                        &emsp;<LogoutButton/>
                    </Navbar.Text>
                </LoggedIn>
                <LoggedOut>
                    <LoginButton className="btn btn-success ml-auto mr-1" popup="/auth-popup.html">Login</LoginButton>
                </LoggedOut>
            </Nav>
        </Navbar>
    );
}
