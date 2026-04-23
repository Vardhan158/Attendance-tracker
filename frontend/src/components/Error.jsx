import React from "react";

const Error = ({ message }) => (
  <div className="bg-red-100 text-red-700 p-4 rounded shadow mb-4">
    {message}
  </div>
);

export default Error;
