package com.awspayroll

import android.content.ContentValues
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SalaryFileModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SalaryFileModule"

  @ReactMethod
  fun saveBase64File(fileName: String, mimeType: String, base64: String, promise: Promise) {
    try {
      val resolver = reactContext.contentResolver
      val values = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
        put(MediaStore.Downloads.MIME_TYPE, mimeType)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          put(MediaStore.Downloads.RELATIVE_PATH, "Download/AWSPayroll")
          put(MediaStore.Downloads.IS_PENDING, 1)
        }
      }

      val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
      } else {
        MediaStore.Files.getContentUri("external")
      }

      val uri = resolver.insert(collection, values)
        ?: throw IllegalStateException("Download file could not be created")

      resolver.openOutputStream(uri)?.use { stream ->
        stream.write(Base64.decode(base64, Base64.DEFAULT))
      } ?: throw IllegalStateException("Download file could not be opened")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
      }

      promise.resolve(uri.toString())
    } catch (error: Exception) {
      promise.reject("SALARY_FILE_SAVE_FAILED", error.message, error)
    }
  }
}
