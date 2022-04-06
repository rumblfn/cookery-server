function base64save(base64Data) {  
  console.log(base64Data)
  return base64Data  
    // Save base64 image to disk
    try
    {
        // Decoding base-64 image
        // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
        function decodeBase64Image (dataString)
        {
          var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          var response = {};

          if (matches.length !== 3)
          {
            return new Error('Invalid input string');
          }

          response.type = matches[1];
          response.data = new Buffer(matches[2], 'base64');

          return response;
        }

        // Regular expression for image type:
        // This regular image extracts the "jpeg" from "image/jpeg"
        var imageTypeRegularExpression      = /\/(.*?)$/;

        // Generate random string
        var crypto                          = require('crypto');
        var seed                            = crypto.randomBytes(20);
        var uniqueSHA1String                = crypto
                                               .createHash('sha1')
                                                .update(seed)
                                                 .digest('hex');

        var base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAZABkAAD/4Q3zaHR0cDovL25zLmFkb2JlLmN...';

        var imageBuffer                      = decodeBase64Image(base64Data);
        var userUploadedFeedMessagesLocation = '../img/upload/feed/';

        var uniqueRandomImageName            = 'image-' + uniqueSHA1String;
        // This variable is actually an array which has 5 values,
        // The [1] value is the real image extension
        var imageTypeDetected                = imageBuffer
                                                .type
                                                 .match(imageTypeRegularExpression);

        var userUploadedImagePath            = userUploadedFeedMessagesLocation +
                                               uniqueRandomImageName +
                                               '.' +
                                               imageTypeDetected[1];

        // Save decoded binary image to disk
        try
        {
        require('fs').writeFile(userUploadedImagePath, imageBuffer.data,
                                function()
                                {
                                  console.log('DEBUG - feed:message: Saved to disk image attached by user:', userUploadedImagePath);
                                });
        }
        catch(error)
        {
            console.log('ERROR:', error);
        }

    }
    catch(error)
    {
        console.log('ERROR:', error);
    }
  }
