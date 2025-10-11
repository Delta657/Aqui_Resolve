package com.example.loginapp.utils

import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import java.util.*

/**
 * Utilitário para formatação automática de campos de texto
 */
object TextFormatter {

    /**
     * Aplica formatação de CEP (00000-000)
     */
    fun applyCepFormatting(editText: EditText) {
        editText.addTextChangedListener(object : TextWatcher {
            private var isUpdating = false

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (isUpdating) return

                val text = s.toString().replace(Regex("[^\\d]"), "")
                val formatted = when {
                    text.length <= 5 -> text
                    text.length <= 8 -> "${text.substring(0, 5)}-${text.substring(5)}"
                    else -> "${text.substring(0, 5)}-${text.substring(5, 8)}"
                }

                isUpdating = true
                editText.setText(formatted)
                editText.setSelection(formatted.length)
                isUpdating = false
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }

    /**
     * Aplica formatação de CPF (000.000.000-00)
     */
    fun applyCpfFormatting(editText: EditText) {
        editText.addTextChangedListener(object : TextWatcher {
            private var isUpdating = false

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (isUpdating) return

                val text = s.toString().replace(Regex("[^\\d]"), "")
                val formatted = when {
                    text.length <= 3 -> text
                    text.length <= 6 -> "${text.substring(0, 3)}.${text.substring(3)}"
                    text.length <= 9 -> "${text.substring(0, 3)}.${text.substring(3, 6)}.${text.substring(6)}"
                    text.length <= 11 -> "${text.substring(0, 3)}.${text.substring(3, 6)}.${text.substring(6, 9)}-${text.substring(9)}"
                    else -> "${text.substring(0, 3)}.${text.substring(3, 6)}.${text.substring(6, 9)}-${text.substring(9, 11)}"
                }

                isUpdating = true
                editText.setText(formatted)
                editText.setSelection(formatted.length)
                isUpdating = false
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }

    /**
     * Aplica formatação de celular ((00) 00000-0000)
     */
    fun applyPhoneFormatting(editText: EditText) {
        editText.addTextChangedListener(object : TextWatcher {
            private var isUpdating = false

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (isUpdating) return

                val text = s.toString().replace(Regex("[^\\d]"), "")
                val formatted = when {
                    text.length <= 2 -> text
                    text.length <= 7 -> "(${text.substring(0, 2)}) ${text.substring(2)}"
                    text.length <= 11 -> "(${text.substring(0, 2)}) ${text.substring(2, 7)}-${text.substring(7)}"
                    else -> "(${text.substring(0, 2)}) ${text.substring(2, 7)}-${text.substring(7, 11)}"
                }

                isUpdating = true
                editText.setText(formatted)
                editText.setSelection(formatted.length)
                isUpdating = false
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }

    /**
     * Remove formatação de um texto (apenas números)
     */
    fun removeFormatting(text: String): String {
        return text.replace(Regex("[^\\d]"), "")
    }

    /**
     * Valida CPF (algoritmo básico)
     */
    fun isValidCpf(cpf: String): Boolean {
        val cleanCpf = removeFormatting(cpf)
        if (cleanCpf.length != 11) return false

        // Verificar se todos os dígitos são iguais
        if (cleanCpf.all { it == cleanCpf[0] }) return false

        // Calcular primeiro dígito verificador
        var sum = 0
        for (i in 0..8) {
            sum += cleanCpf[i].digitToInt() * (10 - i)
        }
        val firstDigit = if (sum % 11 < 2) 0 else 11 - (sum % 11)

        // Calcular segundo dígito verificador
        sum = 0
        for (i in 0..9) {
            sum += cleanCpf[i].digitToInt() * (11 - i)
        }
        val secondDigit = if (sum % 11 < 2) 0 else 11 - (sum % 11)

        return cleanCpf[9].digitToInt() == firstDigit && cleanCpf[10].digitToInt() == secondDigit
    }

    /**
     * Valida CEP (formato básico)
     */
    fun isValidCep(cep: String): Boolean {
        val cleanCep = removeFormatting(cep)
        return cleanCep.length == 8 && cleanCep.all { it.isDigit() }
    }

    /**
     * Valida celular (formato básico)
     */
    fun isValidPhone(phone: String): Boolean {
        val cleanPhone = removeFormatting(phone)
        return cleanPhone.length == 11 && cleanPhone.startsWith("1") && cleanPhone[2] in "9"
    }
}
