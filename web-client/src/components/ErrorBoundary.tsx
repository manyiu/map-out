import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  Container,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Component, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Container>
            <CardHeader>Opps. Something went wrong.</CardHeader>
            <CardBody>
              <Stack>
                <Code>{this.state.error?.name}</Code>
                <Code>{this.state.error?.message}</Code>
                <Code>{this.state.error?.stack}</Code>
                <Text>Please refresh the page or try again later.</Text>
                <Text>
                  You can reset the database in the app settings. (In the menu,
                  click on the gear icon on the bottom left corner.)
                </Text>
                <Text>
                  You may also clear your browser cache and try again.
                </Text>
                <Text>
                  You are welcome to report the issue to the developer by email.
                </Text>
              </Stack>
            </CardBody>
            <CardFooter>
              <Link href="mailto:admin@vazue.com">admin@vazue.com</Link>
            </CardFooter>
          </Container>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
