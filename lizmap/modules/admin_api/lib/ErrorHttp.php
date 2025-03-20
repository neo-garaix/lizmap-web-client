<?php

namespace LizmapApi;

use Lizmap\Request\Proxy;

class ErrorHttp {

    /**
     * Sets an error response with a 501 HTTP status code and a specified error message.
     *
     * @param object $rep The response object.
     *
     * @return object The JSON response with the error details.
     */
    public static function setError(object $rep): object
    {
        // HTTP status code
        $rep->setHttpStatus(
            501,
            Proxy::getHttpStatusMsg(501)
        );

        $rep->data = array(
            'error' => 'Error 501',
            'message' => 'This action is not implemented.'
        );

        return $rep;
    }

    /**
     * Sets the error page data for basic authentication error.
     *
     * @param object $rep The response object where the error data will be set.
     * @return object The modified response object containing error information.
     */
    public static function setBasicAuthErrorPage(object $rep): object
    {
        $rep->data = array(
            'error' => 'Unauthorized',
            'message' => 'Basic authentication is required to access this resource.'
        );

        return $rep;
    }
}
