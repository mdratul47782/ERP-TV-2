{/* LEFT: Media */}
        <section className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* IMAGE */}
          <MediaTile title="Image" icon={ImageIcon}>
            {finalImageSrc && !imgError ? (
              <img
                src={finalImageSrc}
                alt="Quality Image"
                className="h-full w-full object-contain"
                onError={() => {
                  if (imgAttempt < 2) {
                    setImgAttempt(imgAttempt + 1);
                    setImgError(false);
                  } else {
                    setImgError(true);
                  }
                }}
              />
            ) : finalImageSrc && imgError ? (
              <div className="mx-auto max-w-xs rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-center">
                <div className="mb-1 inline-flex items-center gap-1 text-amber-300">
                  <TriangleAlert className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    Image Load Failed
                  </span>
                </div>
                <ul className="mb-2 text-left text-[11px] text-amber-200/90">
                  <li>• Share as "Anyone with the link"</li>
                  <li>• Permission: Viewer</li>
                  <li>• Check File ID</li>
                </ul>
                <div className="font-mono text-[10px] text-white/60 break-all">
                  ID: {extractGoogleDriveId(imageSrc)}
                </div>
                <a
                  href={imageSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-sky-300 hover:underline"
                >
                  Check in Drive <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <Placeholder title="Image" />
            )}
          </MediaTile>

          {/* VIDEO */}
          <MediaTile title="Video" icon={PlayCircle}>
            {videoData &&
            videoData.candidates &&
            videoData.candidates.length ? (
              <VideoPlayer
                sources={videoData.candidates}
                iframeFallback={videoData.embedUrl}
              />
            ) : (
              <Placeholder title="Video" />
            )}
          </MediaTile>
        </section>
