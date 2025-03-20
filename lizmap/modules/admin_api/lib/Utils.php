<?php

namespace LizmapApi;

class Utils
{
    /**
     * Extracts and returns the relative path from a given path.
     *
     * @param string $path The directory path to process.
     * @return string The relative portion of the path, formatted with a trailing slash.
     */
    public static function getRelativePath(string $path): string
    {
        $array = explode('/', $path);
        $length = count($array);

        // Sometimes paths doesn't end with a '/'
        if ($array[$length - 1] == '') {
            return $array[$length - 2] . '/';
        } else {
            return $array[$length - 1] . '/';
        }
    }
}
