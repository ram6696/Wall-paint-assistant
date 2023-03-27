import React, { Component } from "react";
import UploadService from "../services/upload-files.service";
import { ColorExtractor } from "react-color-extractor";

const IMAGE_STYLES = { width: 700, height: 500 };

const SWATCHES_STYLES = {
  marginTop: 20,
  display: "flex",
  justifyContent: "center"
};

export default class UploadFiles extends Component {

  constructor(props) {
    super(props);
    this.selectFile = this.selectFile.bind(this);
    this.upload = this.upload.bind(this);

    this.state = {
      selectedFiles: undefined,
      currentFile: undefined,
      progress: 0,
      message: "",
      fileBuffer: undefined,
      colors: [],
      fileInfos: [],
    };
  }

  renderSwatches = () => {
    const { colors } = this.state;
    console.log(colors);

    return colors.map((color, id) => {
      return (
        <div
          key={id}
          style={{
            backgroundColor: color,
            width: 100,
            height: 100
          }}
        />
      );
    });
  };

  getColors = colors =>
    this.setState(state => ({ colors: [...state.colors, ...colors] }));


  selectFile(event) {
    this.setState({
      selectedFiles: event.target.files,
    });
  }

  fileToBuffer = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
  };
  

  upload = async () => {
    const currentFile = this.state.selectedFiles[0];
    const fileBuffer = await this.fileToBuffer(currentFile);
    const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    console.log(Buffer.from(fileBuffer));

    this.setState({
      message: "File uploaded",
      fileBuffer: base64String
    });

    this.setState({
      progress: 0,
      currentFile: currentFile,
    });

    this.setState({
      selectedFiles: undefined,
    });
  }

  render() {
    const {
      selectedFiles,
      currentFile,
      progress,
      message,
      fileInfos,
    } = this.state;

    return (
      <div>
        {currentFile && (
          <div className="progress">
            <div
              className="progress-bar progress-bar-info progress-bar-striped"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ width: progress + "%" }}
            >
              {progress}%
            </div>
          </div>
        )}

        <label className="btn btn-default">
          <input type="file" onChange={this.selectFile} />
        </label>

        <button
          className="btn btn-success"
          disabled={!selectedFiles}
          onClick={this.upload}
        >
          Upload
        </button>

        <div className="alert alert-light" role="alert">
          {message}
        </div>
        <ColorExtractor getColors={this.getColors}>
          <img src={`data:image/png;base64,${this.state.fileBuffer}`} style={IMAGE_STYLES} />
        </ColorExtractor>
        <div style={SWATCHES_STYLES}>{this.renderSwatches()}</div>
      </div>
    );
  }
}
