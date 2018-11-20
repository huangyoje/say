# connection close
  http协议中，由谁(client还是server)负责关闭连接?
  [https://stackoverflow.com/questions/17437950/when-does-an-http-1-0-server-close-the-connection](https://stackoverflow.com/questions/17437950/when-does-an-http-1-0-server-close-the-connection)

  > In HTTP 0.9, the server always closes the connection after sending the response. The client must close its end of the connection after receiving the response.

  > In HTTP 1.0, the server always closes the connection after sending the response UNLESS the client sent a Connection: keep-alive request header and the server sent a Connection: keep-alive response header. If no such response header exists, the client must close its end of the connection after receiving the response.

 > In HTTP 1.1, the server does not close the connection after sending the response UNLESS the client sent a Connection: close request header, or the server sent a Connection: close response header. If such a response header exists, the client must close its end of the connection after receiving the response.
