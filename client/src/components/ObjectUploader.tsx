// Object Storage File Uploader Component
// Reference: blueprint:javascript_object_storage
import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

type UppyInstance = Uppy;

interface ObjectUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (uploadedFileURL: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxNumberOfFiles?: number;
}

export function ObjectUploader({
  open,
  onClose,
  onUploadComplete,
  acceptedFileTypes = ["image/*"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxNumberOfFiles = 1,
}: ObjectUploaderProps) {
  const [uppy] = useState<UppyInstance>(() => {
    return new Uppy({
      restrictions: {
        maxFileSize,
        maxNumberOfFiles,
        allowedFileTypes: acceptedFileTypes,
      },
      autoProceed: false,
    }).use(AwsS3, {
      async getUploadParameters(file) {
        const response = await fetch("/api/objects/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        return {
          method: "PUT",
          url: data.uploadURL,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        };
      },
    });
  });

  useEffect(() => {
    const handleComplete = (result: any) => {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        onUploadComplete(uploadURL);
        uppy.cancelAll();
      }
    };

    uppy.on("complete", handleComplete);

    return () => {
      uppy.off("complete", handleComplete);
    };
  }, [uppy, onUploadComplete]);

  return (
    <DashboardModal
      uppy={uppy}
      open={open}
      onRequestClose={onClose}
      plugins={["AwsS3"]}
      proudlyDisplayPoweredByUppy={false}
      note={`Upload up to ${maxNumberOfFiles} file(s), max ${Math.round(maxFileSize / 1024 / 1024)}MB each`}
    />
  );
}
