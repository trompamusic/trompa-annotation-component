import {Nav, Navbar} from "react-bootstrap-v5";
import {LoggedIn, LoggedOut, LoginButton, LogoutButton, Value} from "@solid/react";
import {Link} from "react-router-dom";

export default function Navigation() {
    return (
        <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">Annotation demo</Navbar.Brand>
            <Nav className="me-auto">
                <Nav.Link>
                    <Link to="/">Main app</Link>
                </Nav.Link>
                <Nav.Link>
                    <Link to="/kitchensink">Kitchen Sink</Link>
                </Nav.Link>
                <Nav.Link>
                    <Link to="/editors/vocabulary">Fixed Vocabulary editor</Link>
                </Nav.Link>
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
