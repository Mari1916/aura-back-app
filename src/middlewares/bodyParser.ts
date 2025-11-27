import express from "express";

export const bodyParser = [
  express.json({ limit: "20mb" }),
  express.urlencoded({ extended: true })
];
